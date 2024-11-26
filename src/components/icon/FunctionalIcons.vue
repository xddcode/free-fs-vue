<script>
  import { h, resolveDynamicComponent } from 'vue';

  function Icon(props, ctx) {
    const Component = resolveDynamicComponent(`${props.icon}`); // icon图标
    return h(Component);
  }

  export default Icon;
</script>
